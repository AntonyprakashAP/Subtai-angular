import { Component } from '@angular/core';
import { Toast } from "primeng/toast";
import { HeaderComponent } from "../../shared/header/header.component";
import { FooterComponent } from "../../shared/footer/footer.component";

@Component({
  selector: 'app-help',
  imports: [Toast, HeaderComponent, FooterComponent],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss'
})
export class HelpComponent {

}
