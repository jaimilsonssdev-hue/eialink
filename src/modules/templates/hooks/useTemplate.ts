import { useMemo } from "react";
import { TemplateService } from "../services/TemplateService";
export const useTemplate = (id?: string) => useMemo(() => TemplateService.get(id), [id]);
