import React from 'react';
import { View, Text } from 'react-native';
import { RoadNode } from './RoadNode';
import XPBurstOverlay from '../animations/XPBurst';
import { useState } from 'react';

export function CompleteNode({ title, xp }: { title: string; xp: number }) {
  const [show, setShow] = useState(false);

  const handleComplete = () => {
    setShow(true);

    setTimeout(() => {
      setShow(false);
    }, 1500);
  };

  return (
    <>
      <RoadNode
        title={title}
        status="available"
        onPress={handleComplete}
      />

      {show && <XPBurstOverlay xp={xp} />}
    </>
  );
}