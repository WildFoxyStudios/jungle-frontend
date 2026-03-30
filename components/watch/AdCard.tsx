"use client";

/**
 * AdCard placeholder — ads are not yet implemented.
 * Returns null (renders nothing) until a real ad server is integrated.
 * 
 * When ready, this component should:
 * 1. Fetch ad data from an ad server API
 * 2. Track impressions and clicks
 * 3. Display the ad with proper disclosure ("Patrocinado")
 */
export interface AdCardProps {
  position?: number;
}

export function AdCard({ position = 0 }: AdCardProps) {
  // No ads until a real ad server is integrated
  return null;
}
