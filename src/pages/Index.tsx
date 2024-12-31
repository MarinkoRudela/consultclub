import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { ConfigSection } from '@/components/config/ConfigSection';
import { ScannerSection } from '@/components/scanner/ScannerSection';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const businessId = new URLSearchParams(window.location.search).get('business');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // If logged in, fetch own settings
        fetchBusinessSettings(session.user.id);
      } else if (businessId) {
        // If not logged in but business ID provided, fetch that business's settings
        fetchBusinessSettings(businessId);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchBusinessSettings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBusinessSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('booking_url')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business settings:', error);
        toast({
          title: "Error",
          description: "Failed to load business settings",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setBookingUrl(data.booking_url);
      } else if (!session) {
        // Only show this message for public access
        toast({
          title: "Not Found",
          description: "Business booking link not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateBookingUrl = async (url: string) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          profile_id: session.user.id,
          booking_url: url
        });

      if (error) throw error;

      setBookingUrl(url);
      toast({
        title: "Success",
        description: "Booking URL updated successfully"
      });
    } catch (error) {
      console.error('Error updating booking URL:', error);
      toast({
        title: "Error",
        description: "Failed to update booking URL",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const isConfigMode = new URLSearchParams(window.location.search).get('config') === 'true';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-medspa-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-8 relative">
        <Navigation session={session} />
        <Header />
        
        {isConfigMode ? (
          <ConfigSection 
            session={session}
            bookingUrl={bookingUrl}
            updateBookingUrl={updateBookingUrl}
          />
        ) : (
          <ScannerSection 
            bookingUrl={bookingUrl}
            onScanAgain={() => {
              toast({
                title: "Ready for New Scan",
                description: "Please upload your photos for a new analysis."
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;