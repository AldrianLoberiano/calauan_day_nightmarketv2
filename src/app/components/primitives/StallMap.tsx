import React, { useState, useRef } from 'react';
import { Stall } from '../../types';
import { getStallColorClass } from '../../utils/helpers';

interface StallMapProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
