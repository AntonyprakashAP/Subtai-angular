import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private themeKey = 'preferredTheme';

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    const initialTheme = this.getSavedTheme();
    this.setTheme(initialTheme);
  }

  private getSavedTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.themeKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const next: 'light' | 'dark' = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: 'light' | 'dark') {
    const html = document.documentElement;
    this.renderer.setAttribute(html, 'data-bs-theme', theme);
    localStorage.setItem(this.themeKey, theme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return (document.documentElement.getAttribute('data-bs-theme') as 'light' | 'dark') || 'light';
  }
}
