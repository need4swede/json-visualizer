import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import JsonParser from "@/pages/json-parser";
import FullscreenJson from "@/pages/fullscreen-json";

function Router() {
  return (
    <Switch>
      <Route path="/" component={JsonParser} />
      <Route path="/json-parser" component={JsonParser} />
      <Route path="/fullscreen" component={FullscreenJson} />
      <Route path="/:id" component={FullscreenJson} />
      <Route component={JsonParser} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
