import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DynamicDsService } from 'dynamic-ds';
// aaaa
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './styles.scss',
})
export class App implements OnInit {
  protected readonly title = signal('pm-service-fe');
  private themeService = inject(DynamicDsService);

  ngOnInit() {
    this.themeService.initializeTheme().subscribe();
  }
}
