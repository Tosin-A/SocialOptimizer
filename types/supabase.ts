// Auto-generated Supabase types placeholder.
// Run `npm run db:generate` after connecting your Supabase project to regenerate.
//
// The shape below prevents TypeScript from inferring table rows as `never`
// when the real generated types aren't present yet.
type AnyRow = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      [tableName: string]: {
        Row: AnyRow;
        Insert: AnyRow;
        Update: AnyRow;
        Relationships: unknown[];
      };
    };
    Views: {
      [viewName: string]: {
        Row: AnyRow;
      };
    };
    Functions: {
      [funcName: string]: unknown;
    };
    Enums: {
      [enumName: string]: string;
    };
  };
};
