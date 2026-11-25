'use client';

import React from 'react';
import JardProcProducts from '../JardProcProducts';
import { staffApi } from '@/staffApi';

const STAFF_ENDPOINTS = {
  list: '/products',
  add: '/products',
  update: (id) => `/products/${id}`,
  remove: (id) => `/products/${id}`,
  bulk: '/products',
};

const StaffProducts = () => (
  <JardProcProducts
    apiClient={staffApi}
    endpoints={STAFF_ENDPOINTS}
    allowDelete={false}
    allowBulk={false}
    heading="Shop Products"
  />
);

export default StaffProducts;
