import { useTheme as useThemeContext } from "@/components/theme-provider";

export function useTheme() {
  return useThemeContext();
}
