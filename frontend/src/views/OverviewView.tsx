import React from 'react';
import { OverviewGateway } from '../components/overview/OverviewGateway';

interface OverviewViewProps {
  onExploreCapstone?: () => void;
  onExploreResearch?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onExploreCapstone = () => {},
  onExploreResearch = () => {},
}) => {
  return (
    <OverviewGateway
      onExploreCapstone={onExploreCapstone}
      onExploreResearch={onExploreResearch}
    />
  );
};
