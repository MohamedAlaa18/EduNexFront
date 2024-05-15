import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  loading: boolean = true;

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (event instanceof NavigationEnd) {
        this.loading = false;
      }
    });

    // Prevent right-click context menu
    // document.addEventListener('contextmenu', function (event) {
    //   event.preventDefault();
    // });

    // Prevent Ctrl+Shift+C
    // document.addEventListener('keydown', (event) => {
    //   if (event.ctrlKey && event.shiftKey && event.key === 'C') {
    //     event.preventDefault();
    //   }
    // });
  }

  // Prevent F12 and Ctrl+Shift+I
  // @HostListener('document:keydown', ['$event'])
  // handleKeyboardEvent(event: KeyboardEvent) {
  //   if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
  //     event.preventDefault();
  //   }
  // }
}
