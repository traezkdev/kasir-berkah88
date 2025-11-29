import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '../../utils/cn'; // Assuming cn utility is available for styling

const DateRangePicker = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DatePicker
      ref={ref}
      className={cn(className)} // Apply custom className to the wrapper if needed
      inputClassName={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [direction:ltr] text-foreground",
      )}
      {...props}
    />
  );
});

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
