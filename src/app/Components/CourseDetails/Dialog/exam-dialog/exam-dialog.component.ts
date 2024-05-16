import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IExam } from 'src/app/Model/iexam'; // Assuming the interface IExam is imported from the correct path
import { ExamService } from 'src/app/Services/Exam/exam.service'; // Assuming the service is imported from the correct path
import { isAnyValueMissing, isDurationValid, isStartDateBeforeEndDate, isStartDateInFuture } from 'src/app/Validator/exam-validators';
import { convertDateFormat, convertTimeFormat } from 'src/app/Components/Exam/DateTimeFormat';

@Component({
  selector: 'app-exam-dialog',
  templateUrl: './exam-dialog.component.html',
  styleUrls: ['./exam-dialog.component.css']
})
export class ExamDialogComponent {
  contentForm!: FormGroup;
  @Output() formDataSubmitted: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public dialogRef: MatDialogRef<ExamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private snackBar: MatSnackBar,
    private examService: ExamService // Inject the ExamService
  ) { }

  ngOnInit(): void {
    this.contentForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.pattern(/^[\u0600-\u06FF\u0750-\u077F\s0-9a-zA-Z]+$/)]),
      startTime: new FormControl('', Validators.required),
      endTime: new FormControl('', Validators.required),
      startDate: new FormControl('', Validators.required),
      endDate: new FormControl('', Validators.required),
      duration: new FormControl('', [Validators.required, Validators.min(5), Validators.max(180)]),
    }, {
      validators: [
        isAnyValueMissing,
        isStartDateBeforeEndDate,
        isDurationValid,
        // isStartDateInFuture
      ]
    });
  }

  displayErrorMessages(): void {
    const formErrors = this.contentForm.errors;

    if (formErrors) {
      if (formErrors['anyValueMissing']) {
        this.openSnackBar('يرجى ملء جميع الحقول', 'حسناً');
      }
      if (formErrors['startDateAfterEndDate']) {
        this.openSnackBar('تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء', 'حسناً');
      }
      if (formErrors['durationInvalid']) {
        this.openSnackBar('المدة المحددة أطول من المدة الفعلية للامتحان', 'حسناً');
      }
      if (formErrors['startDatePast']) {
        this.openSnackBar('يجب أن يكون تاريخ البداية في المستقبل', 'حسناً');
      }
    } else {
      Object.keys(this.contentForm.controls).forEach(controlName => {
        const control = this.contentForm.get(controlName);
        if (control && control.errors) {
          if (control.errors?.['required']) {
            this.openSnackBar('هذا الحقل مطلوب', 'حسناً');
          }
        }
      });
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'bottom',
      horizontalPosition: 'right',
    });
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(event: Event): void {
    if (this.contentForm.invalid) {
      this.displayErrorMessages();
      return;
    }

    const formData = this.contentForm.value;

    // Convert start date and end date formats
    const startDate = convertDateFormat(formData.startDate);
    const endDate = convertDateFormat(formData.endDate);

    const startTime = convertTimeFormat(formData.startTime);
    const endTime = convertTimeFormat(formData.endTime);

    // Prepare exam data
    const examData = {
      title: formData.title,
      startDateTime: `${startDate}T${startTime}`,
      endDateTime: `${endDate}T${endTime}`,
      duration: formData.duration,
      type: this.data.examType,
      lectureId: this.data.lectureId,
    };

    this.examService.addExam(examData).subscribe(
      (exam: IExam) => {
        console.log('Exam created successfully:', exam);
        this.router.navigate(['/course', this.data.courseID, 'lesson', this.data.lectureId, 'create'], {
          queryParams: { examId: exam.id }
        });
      },
      (error) => {
        if (error.status == 200) {
          window.location.reload();
        }
        console.error('Error occurred while creating exam:', error);

      }
    );
    this.dialogRef.close();
  }
}
