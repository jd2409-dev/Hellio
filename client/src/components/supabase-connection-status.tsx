import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export default function SupabaseConnectionStatus() {
  const isConfigured = isSupabaseConfigured()
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          <span className="font-medium">
            Supabase Status: {isConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>
        
        {!isConfigured && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
              Supabase is not configured. To enable database functionality:
            </p>
            <ol className="text-sm text-orange-800 dark:text-orange-200 space-y-1 ml-4 list-decimal">
              <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Replit Secrets</li>
              <li>Create your database tables as needed</li>
            </ol>
            <p className="text-sm text-orange-800 dark:text-orange-200 mt-2">
              See <code>SUPABASE_SETUP.md</code> for detailed setup instructions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}