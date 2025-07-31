import { Component } from '@angular/core';
import { AuthService } from '../../_service/auth.service';
import { ThemeService } from '../../_service/theme.service';
import { HeaderComponent } from "../../shared/header/header.component";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [HeaderComponent, FormsModule, CommonModule, ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isLoggedIn: boolean = false;
  username: string = '';
  password: string = '';
  email: string = '';
  message: string | null = null;
  protectedData: string = '';
  currentPage: 'login' | 'register' = 'login';

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.fetchProtectedData();
    }
  }

  handleLogin(form: any): void {
    this.message = '';
    this.username = form.controls['name'].value;
    this.password = form.controls['password'].value;

    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        this.message = 'Login successful! Redirecting...';
        this.username = '';
        this.password = '';
        this.router.navigate(['/profile']);
        form.reset()
      },
      error: (error) => {
        this.message = `Invalid Crediential`;
        form.reset()

      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.message = 'Logged out.';
    this.protectedData = '';
  }

  fetchProtectedData(): void {
    this.authService.getProtectedData().subscribe({
      next: (data: any) => {
        this.protectedData = JSON.stringify(data, null, 2);
      },
      error: (error: { message: string | string[]; }) => {
        this.protectedData = `Error fetching protected data: ${error.message}`;
        if (error.message.includes('Unauthorized') || error.message.includes('Invalid Token')) {
          this.handleLogout();
        }
      }
    });
  }

  setCurrentPage(page: 'login' | 'register'): void {
    this.currentPage = page;
  }


  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
