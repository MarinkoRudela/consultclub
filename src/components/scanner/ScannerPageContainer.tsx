import { BusinessBrandedHeader } from "./BusinessBrandedHeader";
import { ScannerSection } from "./ScannerSection";
import { toast } from "@/hooks/use-toast";

interface ScannerPageContainerProps {
  businessData: {
    brand_name: string;
    logo_url: string;
    tagline: string;
    business_settings: {
      booking_url: string;
    } | null;
    profile_id: string;
  };
  shortCode: string;
  linkVisitId?: string;
}

export const ScannerPageContainer = ({ 
  businessData,
  shortCode,
  linkVisitId
}: ScannerPageContainerProps) => {
  console.log('ScannerPageContainer received:', {
    brandName: businessData.brand_name,
    bookingUrl: businessData.business_settings?.booking_url,
    profileId: businessData.profile_id
  });

  const bookingUrl = businessData.business_settings?.booking_url;
  
  // Only show the setup warning if business_settings is null
  if (!businessData.business_settings) {
    console.warn('No business settings found for business');
    toast({
      title: "Setup Required",
      description: "This business hasn't completed their profile setup yet. Please try again later.",
      variant: "destructive"
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medspa-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <BusinessBrandedHeader
          brandName={businessData.brand_name}
          logoUrl={businessData.logo_url}
          tagline={businessData.tagline}
        />
        <ScannerSection
          bookingUrl={bookingUrl || '/signup'}
          profileId={businessData.profile_id}
          shortCode={shortCode}
          linkVisitId={linkVisitId}
          onScanAgain={() => {
            toast({
              title: "Ready",
              description: "Upload new photos for another analysis",
            });
          }}
        />
      </div>
    </div>
  );
};