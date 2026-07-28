import type { TemplateDefinition } from "../types";
export class TemplateRegistry {
  private readonly templates = new Map<string, TemplateDefinition>();
  constructor(private readonly defaultId: string) {}
  register(template: TemplateDefinition) {
    this.templates.set(template.id, template);
    return this;
  }
  find(id: string) {
    return this.templates.get(id);
  }
  findById(id: string) {
    return this.find(id);
  }
  list() {
    return [...this.templates.values()];
  }
  exists(id: string) {
    return this.templates.has(id);
  }
  getDefault() {
    const template = this.find(this.defaultId);
    if (!template) throw new Error(`Default template '${this.defaultId}' is not registered.`);
    return template;
  }
}
