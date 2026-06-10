import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Custom base query that handles token inclusion and network errors
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  try {
    const result = await baseQuery(args, api, extraOptions)
    if (result.error) {
      const msg = result.error.message || String(result.error.data?.error || '')
      if (result.error.status === 'FETCH_ERROR') {
        return {
          error: {
            status: 'FETCH_ERROR',
            error: 'Cannot reach API. Ensure the backend server is running.',
          },
        }
      }
    }
    return result
  } catch (e) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: e.message || 'An unexpected error occurred',
      },
    }
  }
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Layout', 'User', 'Lead', 'Activity'],
  endpoints: (builder) => ({
    // Auth Endpoints
    getMe: builder.query({
      query: () => '/api/auth/me',
      providesTags: ['User'],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/signup',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/api/auth/me',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    // Layout Endpoints
    getLayouts: builder.query({
      query: () => '/api/layouts',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Layout', id })),
              { type: 'Layout', id: 'LIST' },
            ]
          : [{ type: 'Layout', id: 'LIST' }],
    }),
    getLayoutById: builder.query({
      query: (id) => `/api/layouts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Layout', id }],
    }),
    getLayoutBySlug: builder.query({
      query: (slug) => `/api/layouts/by-slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Layout', id: slug }],
    }),
    createLayout: builder.mutation({
      query: (layoutData) => ({
        url: '/api/layouts',
        method: 'POST',
        body: layoutData,
      }),
      invalidatesTags: [{ type: 'Layout', id: 'LIST' }],
    }),
    updateLayout: builder.mutation({
      query: ({ id, ...layoutData }) => ({
        url: `/api/layouts/${id}`,
        method: 'PUT',
        body: layoutData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),
    deleteLayout: builder.mutation({
      query: (id) => ({
        url: `/api/layouts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Layout', id: 'LIST' }],
    }),
    convertToBuilding: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/layouts/${id}/convert-to-building`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),

    // Media Upload Endpoints (using FormData)
    uploadLayoutImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/layouts/${id}/image`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),
    uploadFacadeImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/layouts/${id}/facade-image`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),
    uploadFloorImage: builder.mutation({
      query: ({ id, floorId, formData }) => ({
        url: `/api/layouts/${id}/floor-image?floorId=${encodeURIComponent(floorId)}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),
    uploadApartmentMedia: builder.mutation({
      query: ({ id, floorId, configId, kind, formData }) => ({
        url: `/api/layouts/${id}/apartment-media?floorId=${encodeURIComponent(floorId)}&configId=${encodeURIComponent(configId)}&kind=${kind}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Layout', id },
        { type: 'Layout', id: 'LIST' },
      ],
    }),

    // Admin Endpoints
    getPlatformAnalytics: builder.query({
      query: () => '/api/admin/analytics',
      providesTags: ['User', 'Layout', 'Lead'],
    }),
    getAdminUsers: builder.query({
      query: () => '/api/admin/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User', id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getAdminLeads: builder.query({
      query: (limit = 100) => `/api/admin/leads?limit=${limit}`,
      providesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    getMyLeads: builder.query({
      query: () => '/api/leads/me',
      providesTags: [{ type: 'Lead', id: 'MY_LIST' }],
    }),
    getAdminActivity: builder.query({
      query: (limit = 200) => `/api/admin/activity?limit=${limit}`,
      providesTags: [{ type: 'Activity', id: 'LIST' }],
    }),
    createAdminUser: builder.mutation({
      query: (userData) => ({
        url: '/api/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateAdminUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/api/admin/users/${id}`,
        method: 'PATCH',
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/api/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    pushLeadWebhook: builder.mutation({
      query: (leadId) => ({
        url: `/api/admin/leads/${leadId}/push-webhook`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    updateLeadStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/api/admin/leads/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),

    // Public / Visitor Endpoints
    createLead: builder.mutation({
      query: (leadData) => ({
        url: '/api/leads',
        method: 'POST',
        body: leadData,
      }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    trackLead: builder.query({
      query: (trackingId) => `/api/leads/track/${trackingId}`,
    }),
    postActivity: builder.mutation({
      query: (activityData) => ({
        url: '/api/activity',
        method: 'POST',
        body: activityData,
      }),
      invalidatesTags: [{ type: 'Activity', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetMeQuery,
  useLoginMutation,
  useSignupMutation,
  useUpdateProfileMutation,
  useGetLayoutsQuery,
  useGetLayoutByIdQuery,
  useGetLayoutBySlugQuery,
  useCreateLayoutMutation,
  useUpdateLayoutMutation,
  useDeleteLayoutMutation,
  useConvertToBuildingMutation,
  useUploadLayoutImageMutation,
  useUploadFacadeImageMutation,
  useUploadFloorImageMutation,
  useUploadApartmentMediaMutation,
  useGetPlatformAnalyticsQuery,
  useGetAdminUsersQuery,
  useGetAdminLeadsQuery,
  useGetMyLeadsQuery,
  useGetAdminActivityQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  usePushLeadWebhookMutation,
  useUpdateLeadStatusMutation,
  useCreateLeadMutation,
  useTrackLeadQuery,
  usePostActivityMutation,
} = apiSlice
