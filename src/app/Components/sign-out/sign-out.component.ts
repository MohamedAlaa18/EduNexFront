import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent {
  constructor(
    public dialogRef: MatDialogRef<SignOutComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private router: Router,
    // private cdRef: ChangeDetectorRef
  ) { }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
    this.logOut();
  }

  logOut(): void {
    this.authService.removeToken();
    this.authService.removeUserId();
    this.authService.removeUserRole();

    this.authService.logOut().subscribe(
      () => {
        console.log('Logout successful');
        // location.reload();
        this.router.navigate(['/']);
      },
      error => {
        console.error('Logout failed:', error);
      }
    );
  }
}
