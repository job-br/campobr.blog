import React from 'react';
import { AdSenseConfig } from '../types';
import { ADSENSE_CLIENT, ADSENSE_SLOTS } from '../config/monetization';
import { AdUnit } from './AdUnit';

interface ArticleAdSenseSlotProps {
  adsConfig?: AdSenseConfig;
}

/** Anúncio dentro do artigo (real, rotulado "Publicidade"). */
export const ArticleAdSenseSlot: React.FC<ArticleAdSenseSlotProps> = ({ adsConfig }) => {
  if (adsConfig && adsConfig.adsenseEnabled === false) return null;
  return (
    <div className="my-8">
      <AdUnit
        publisherId={adsConfig?.publisherId || ADSENSE_CLIENT}
        slot={adsConfig?.slotFeedMiddle || ADSENSE_SLOTS.article}
        format="fluid"
        layout="in-article"
      />
    </div>
  );
};
