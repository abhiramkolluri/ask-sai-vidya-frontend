import React, { useRef, useState } from "react";
import Chat from "../../images/chat.jpg";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import MaterialInput from "../input/MaterialInput";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { IoMdAlert, IoMdCheckmark } from "react-icons/io";
import { Button, Input, Typography } from "@material-tailwind/react";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const registerSchema = z
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

const FieldError = ({ errorField }) => {
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

export default function Signup({ callback = () => {}, inModal = true }) {
  const [inputTypes, setInputTypes] = useState({
    password: "password",
    confirmPassword: "password",
  });
  const [error, setError] = useState(null);
  const {
    register,
    registering,
    error: authError,
    success: authSuccess,
  } = useAuth();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const toggleInputTypes = (type) => {
    setInputTypes({
      ...inputTypes,
      [type]: inputTypes[type] === "password" ? "text" : "password",
    });
  };

  const InputPasswordIcon = ({ type }) => {
    const onClick = () => toggleInputTypes(type);
    return inputTypes[type] === "password" ? (
      <VscEye size={18} onClick={onClick} />
    ) : (
      <VscEyeClosed size={18} onClick={onClick} />
    );
  };

  const handleSignup = (data) => {
    setError(null);

    console.log("Errors: ", errors);
    if (!isValid) return;

    // const formData = new FormData(formRef.current);
    // const data = Object.fromEntries(formData);

    // if (data.confirmPassword !== data.password) {
    //   setError("Passwords do not match");
    //   return;
    // }

    // if (
    //   data.email === "" ||
    //   data.password === "" ||
    //   data.first_name === "" ||
    //   data.last_name === ""
    // ) {
    //   setError("Please fill all the fields");
    //   return;
    // }

    // if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) !== true) {
    //   setError("Please enter a valid email address");
    //   return;
    // }

    // if (data.email.length < 5) {
    //   setError("Please enter a valid email address");
    //   return;
    // }

    // if (data.first_name.length < 3) {
    //   setError("First name must be at least 3 characters");
    //   return;
    // }

    // if (data.last_name.length < 3) {
    //   setError("Last name must be at least 3 characters");
    //   return;
    // }

    // if (data.password.length < 8) {
    //   setError("Password must be at least 8 characters");
    //   return;
    // }

    console.log(data);
    try {
      register({ email: data.email, password: data.password });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-[400px] bg-white rounded overflow-hidden text-[14px] flex flex-col gap-2 justify-between text-gray-600">
      {inModal ? (
        <div>
          <img src={Chat} height={"140px"} width={"400px"} alt="" />
        </div>
      ) : (
        <></>
      )}

      <div className="bg-white z-10 py-8 px-4">
        <div className=" flex flex-col gap-4">
          <form
            className="flex flex-col gap-4 "
            // ref={formRef}
            onSubmit={handleSubmit(handleSignup)}>
            {inModal ? (
              <>
                <h1 className="font-bold text-center my-4">
                  Sign in to continue and save your conversation
                </h1>
              </>
            ) : (
              <></>
            )}

            {/* Error states */}
            <div className="mb-2">
              {(Object.values(errors).length || authError) && (
                // create a div for flashing error
                <div className="text-red-500 text-center font-lg font-bold border-red-500 border rounded p-2 flex justify-around align-center">
                  <span className="text-red-500 flex w-8">
                    <IoMdAlert size={24} />
                  </span>
                  <span className="flex-[4] text-left">
                    {authError}
                    {Object.values(errors).length ? (
                      <span>Please address the form errors.</span>
                    ) : null}
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

            <Input
              label="First name"
              {...formRegister("first_name")}
              error={!!errors.first_name}
              disabled={registering}
            />
            <FieldError errorField={errors.first_name} />

            <Input
              label="Last name"
              {...formRegister("last_name")}
              error={!!errors.last_name}
              disabled={registering}
            />
            <FieldError errorField={errors.last_name} />

            <Input
              label="Email"
              name="email"
              {...formRegister("email")}
              error={!!errors.email}
              disabled={registering}
            />
            <FieldError errorField={errors.email} />

            <Input
              label="Password"
              name="password"
              type={inputTypes.password}
              icon={<InputPasswordIcon type="password" />}
              {...formRegister("password")}
              error={!!errors.password}
              disabled={registering}
            />
            <FieldError errorField={errors.password} />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={inputTypes.confirmPassword}
              icon={<InputPasswordIcon type="confirmPassword" />}
              {...formRegister("confirmPassword")}
              error={!!errors.confirmPassword}
              disabled={registering}
            />
            <FieldError errorField={errors.confirmPassword} />
            <Button
              className="bg-primary"
              type="submit"
              loading={registering}
              disabled={registering || authSuccess}>
              Sign up
            </Button>
          </form>

          <h1 className="text-center font-thin">
            Already have a account?{" "}
            {!inModal ? (
              <>
                <Link to="/signin">
                  <span className=" text-orange-400 cursor-pointer">
                    Sign In
                  </span>
                </Link>
              </>
            ) : (
              <>
                <span
                  className=" text-orange-400 cursor-pointer"
                  onClick={callback}>
                  Sign In
                </span>
              </>
            )}{" "}
          </h1>

          <div className="border-t mt-2 border-gray-300 flex justify-center items-center">
            <div className="bg-white relative -top-[20px] p-2 text-gray-300">
              or
            </div>
          </div>
          <button className=" -mt-4 w-full h-[40px]  border border-gray-300  flex justify-between px-2 items-center rounded">
            Continue with Google
            <span>
              <FcGoogle size={18} />
            </span>
          </button>
          <button className="w-full h-[40px]  border border-gray-300  flex justify-between px-2 items-center rounded">
            Continue with Apple
            <span>
              <FaApple size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
