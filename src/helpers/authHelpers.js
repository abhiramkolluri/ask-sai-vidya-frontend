import { z } from "zod";

import { Typography } from "@material-tailwind/react";
import { IoMdAlert, IoMdCheckmark } from "react-icons/io";

export const FieldError = ({ errorField }) => {
  if (!errorField || !errorField.message) return null;
  return (
    <Typography
      variant="small"
      color="red"
      className="mt-[-1rem] font-semibold">
      {errorField.message}
    </Typography>
  );
};

export const registerSchema = z
  .object({
    first_name: z.string().min(3, "First name must be at least 3 characters"),
    last_name: z.string().min(3, "Last name must be at least 3 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(5, "Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(5, "Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const FormFlashMessages = ({ errors, authError, authSuccess }) => (
  <>
    {/* Error states */}
    <div className="-mb-5">
      {(Object.values(errors).length || authError) && (
        // create a div for flashing error
        <div className="text-red-500 text-center font-lg font-bold border-red-500 border rounded p-2 flex justify-around align-center">
          <span className="text-red-500 flex w-8">
            <IoMdAlert size={24} />
          </span>
          <span className="flex-[4] text-left">
            {Object.values(errors).length ? (
              <span>Please address the form errors.</span>
            ) : authError ? (
              authError
            ) : (
              ""
            )}
          </span>
        </div>
      )}
    </div>

    {/* Success states */}
    <div className="mb-2">
      {authSuccess && (
        <div className="text-green-500 text-center font-lg font-bold border-green-500 border rounded p-2 flex justify-around align-center">
          <span className="text-green-500 flex w-8">
            <IoMdCheckmark size={24} />
          </span>
          <span className="flex-[4] text-left">{authSuccess}</span>
        </div>
      )}
    </div>
  </>
);
