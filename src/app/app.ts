import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DynamicDsService } from 'dynamic-ds';
import { NotificationModalComponent } from './components/shared/notification-modal/notification-modal.component';
// aaaa
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationModalComponent],
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
