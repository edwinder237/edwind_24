import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20 } = {}) =>
        `notifications?page=${page}&limit=${limit}`,
      providesTags: ['Notification'],
    }),

    syncNotifications: builder.mutation({
      query: () => ({ url: 'notifications/sync', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation({
      query: ({ id, all } = {}) => ({
        url: 'notifications/mark-read',
        method: 'PATCH',
        body: id ? { id } : { all: true },
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useSyncNotificationsMutation,
  useMarkNotificationReadMutation,
} = notificationApi;
