# RFC-004: Layout System

Fluxo: `PageData` → Template Engine → `TemplateRenderModel` → `LayoutResolver` → layout → `ComponentRegistry`.

Layouts somente ordenam componentes tipados e não acessam dados ou Supabase. O Registry de componentes encapsula a renderização dos componentes públicos. O Resolver tem fallback vertical e permite novos layouts por registro. A próxima Sprint pode adicionar manifests de layouts e lazy loading por layout.
