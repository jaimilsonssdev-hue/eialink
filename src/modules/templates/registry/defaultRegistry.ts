import { TemplateRegistry } from "./TemplateRegistry";
import { defaultTheme } from "../themes/defaultTheme";
export const templateRegistry = new TemplateRegistry("default").register({
  id: "default",
  slug: "default",
  name: "Padrão",
  description: "Template base seguro.",
  category: "base",
  version: "1.0.0",
  theme: defaultTheme,
  layout: "vertical",
  components: ["banner", "profile", "links"],
  supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  status: "active",
});
