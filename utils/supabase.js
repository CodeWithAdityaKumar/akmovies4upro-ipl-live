// This file serves as a compatibility layer for transitioning from Supabase to PostgreSQL
// It will redirect API calls to our PostgreSQL database through Next.js API routes

// Import the database connection from our new db utility
const db = require('./db');

const mockDataEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Create a mock response that mimics Supabase's response structure
const mockResponse = (data = null, error = null) => {
  return Promise.resolve({ data, error });
};

// Create a compatibility layer that warns but doesn't break existing code
const supabase = {
  // Add mock auth functionality
  auth: {
    getUser: () => {
      console.warn('⚠️ Deprecated: Supabase auth is deprecated. Please use the new authentication system.');
      return Promise.resolve({ data: { user: null }, error: null });
    },
    signInWithPassword: () => {
      console.warn('⚠️ Deprecated: Supabase auth is deprecated. Please use the new authentication system.');
      return Promise.resolve({ data: null, error: { message: 'Using custom auth now' } });
    },
    signOut: () => {
      console.warn('⚠️ Deprecated: Supabase auth is deprecated. Please use the new authentication system.');
      return Promise.resolve({ error: null });
    }
  },
  
  // Add mock realtime functionality
  channel: (channelName) => {
    console.warn(`⚠️ Deprecated: Supabase realtime is deprecated for channel '${channelName}'. Please use polling or WebSockets instead.`);
    return {
      on: (event, config, callback) => {
        console.warn(`⚠️ Deprecated: Supabase realtime event '${event}' on '${config.table}' is deprecated.`);
        return {
          subscribe: () => {
            console.warn('⚠️ Supabase subscription is deprecated and does nothing.');
            return {};
          }
        };
      }
    };
  },
  
  // Method to clean up channels (mock implementation)
  removeChannel: (channel) => {
    console.warn('⚠️ Deprecated: Supabase removeChannel is deprecated.');
    return true;
  },
  // The main entry point for most Supabase operations
  from: (table) => {
    console.warn(`⚠️ Deprecated: Supabase client is deprecated for table '${table}'. Please use PostgreSQL API endpoints instead.`);
    
    return {
      // Mimic the select method but redirect to API
      select: (columns) => {
        return {
          eq: (column, value) => {
            return {
              order: (orderColumn, { ascending } = {}) => {
                return {
                  limit: (limit) => {
                    // Log what would have been fetched
                    console.log(`Would fetch ${columns} from ${table} where ${column}=${value} order by ${orderColumn} limit ${limit}`);
                    // Return empty data with warning
                    return mockResponse([], { message: 'Using PostgreSQL now. Update your code to use API routes.' });
                  },
                  single: () => {
                    return mockResponse(null, { message: 'Using PostgreSQL now. Update your code to use API routes.' });
                  }
                };
              },
              limit: (limit) => {
                return mockResponse([], { message: 'Using PostgreSQL now. Update your code to use API routes.' });
              }
            };
          },
          neq: () => ({
            order: () => ({
              limit: () => mockResponse([], { message: 'Using PostgreSQL now' })
            })
          }),
          gt: () => ({
            order: () => ({
              limit: () => mockResponse([], { message: 'Using PostgreSQL now' })
            })
          }),
          lt: () => ({
            order: () => ({
              limit: () => mockResponse([], { message: 'Using PostgreSQL now' })
            })
          })
        };
      },
      
      // Mock other Supabase methods
      insert: (rows) => mockResponse(null, { message: 'Using PostgreSQL now. Update your code to use API routes.' }),
      update: (data) => mockResponse(null, { message: 'Using PostgreSQL now. Update your code to use API routes.' }),
      delete: () => mockResponse(null, { message: 'Using PostgreSQL now. Update your code to use API routes.' }),
      upsert: (rows) => mockResponse(null, { message: 'Using PostgreSQL now. Update your code to use API routes.' })
    };
  },
  
  // Auth methods (if needed)
  auth: {
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null })
  },
  
  // Storage methods (if needed)
  storage: {
    from: (bucket) => ({
      list: () => mockResponse([], null),
      upload: () => mockResponse(null, { message: 'Using PostgreSQL now' }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  },
  
  // Direct access to our PostgreSQL connection if needed
  db
};

module.exports = supabase;
export default supabase;
export { db };

