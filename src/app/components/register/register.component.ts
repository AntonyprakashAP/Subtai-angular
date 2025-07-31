import { Component } from '@angular/core';
import { ThemeService } from '../../_service/theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../../shared/header/header.component";
import { FooterComponent } from "../../shared/footer/footer.component";
import { AuthService } from '../../_service/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  email: string = '';
  message: string | null = null;


  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) { }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  onRegisterSubmit(form: any) {
    this.message = '';
    this.username = form.controls['name'].value;
    this.password = form.controls['password'].value;
    this.email = form.controls['email'].value;
    // return;
    this.authService.register(this.username, this.password, this.email).subscribe({
      next: (data) => {
        this.message = 'Registration successful! Please log in.';
        this.username = '';
        this.password = '';
        this.email = '';
        this.router.navigate(['/login'])
        form.reset();
      },
      error: (error) => {
        this.message = `Registration failed: ${error.message}`;
        form.reset();
      }
    });
  }
  handleRegister(): void {

  }
}
