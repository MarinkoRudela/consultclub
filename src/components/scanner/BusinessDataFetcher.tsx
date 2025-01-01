import { useEffect } from "react";
import { fetchBusinessData } from "@/services/businessDataService";
import { toast } from "@/hooks/use-toast";

interface BusinessData {
  brand_name: string;
  logo_url: string;
  tagline: string;
  booking_url: string;
}

interface BusinessDataFetcherProps {
  shortCode: string;
  onDataFetched: (data: BusinessData) => void;
  onError: (error: string) => void;
}

export const BusinessDataFetcher = ({ 
  shortCode, 
  onDataFetched, 
  onError 
}: BusinessDataFetcherProps) => {
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const businessInfo = await fetchBusinessData(shortCode);
        onDataFetched(businessInfo);
        
        toast({
          title: "Success",
          description: "Welcome to the face analysis tool",
        });
      } catch (err: any) {
        console.error('Error in loadBusinessData:', err);
        onError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    loadBusinessData();
  }, [shortCode, onDataFetched, onError]);

  return null;
};