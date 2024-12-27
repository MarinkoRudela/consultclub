import React, { useState, useEffect } from 'react';
import { FaceScanner } from '@/components/FaceScanner';
import { Analysis } from '@/components/Analysis';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { ConfigurationView } from '@/components/ConfigurationView';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CapturedImages {
  front?: string;
  left?: string;
  right?: string;
}

const Index = () => {
  const [capturedImages, setCapturedImages] = useState<CapturedImages | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchBusinessSettings();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchBusinessSettings();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching business settings:', error);
          toast({
            title: "Error",
            description: "Failed to load business settings",
            variant: "destructive"
          });
        }
      } else if (data) {
        setBookingUrl(data.booking_url);
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

  const handleImageCapture = async (images: CapturedImages) => {
    setCapturedImages(images);
    const mockAnalysis = {
      concerns: [
        "Fine lines around eyes",
        "Uneven skin texture",
        "Minor sun damage",
        "Slight volume loss in cheeks"
      ],
      recommendations: [
        "Hydrafacial treatment for skin rejuvenation",
        "LED light therapy for collagen stimulation",
        "Custom skincare routine with SPF protection",
        "Consider dermal fillers for cheek enhancement"
      ]
    };
    
    setTimeout(() => {
      setAnalysis(mockAnalysis);
      toast({
        title: "Analysis Complete",
        description: "We've analyzed your photos and prepared personalized recommendations."
      });
    }, 1500);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Consult Club Analysis',
          text: 'Check out my personalized treatment recommendations!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share it with others!"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
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
          <ConfigurationView 
            session={session}
            bookingUrl={bookingUrl}
            updateBookingUrl={updateBookingUrl}
          />
        ) : (
          <div className="space-y-8">
            {!analysis && (
              <FaceScanner onImageCapture={handleImageCapture} />
            )}

            {analysis && (
              <Analysis
                analysis={analysis}
                bookingUrl={bookingUrl}
                onShare={handleShare}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;