import React, { useState, useRef } from 'react';
import { Stall } from '../../types';
import { getStallColorClass } from '../../utils/helpers';

interface StallMapProps {
  onStallClick: (stall: Stall) => void;
