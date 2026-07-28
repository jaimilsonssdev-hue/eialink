import { useMemo } from "react";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
export const useTemplatePreview = (data: PageData, id?: string) =>
  useMemo(() => TemplateService.render(data, id), [data, id]);
