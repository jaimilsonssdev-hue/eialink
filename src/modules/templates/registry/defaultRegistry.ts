import { templateManifest } from "../manifest/templateManifest";
import { TemplateRegistry } from "./TemplateRegistry";

export const templateRegistry = templateManifest.reduce(
  (registry, template) => registry.register(template),
  new TemplateRegistry("default"),
);
