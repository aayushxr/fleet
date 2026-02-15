"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { joinFormSchema, type JoinFormValues } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export default function Home() {
  const router = useRouter();
  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: { username: "", roomName: "" },
  });

  const onSubmit = (values: JoinFormValues) => {
    sessionStorage.setItem("fleet:username", values.username);
    const slug = values.roomName.toLowerCase().replace(/\s+/g, "-");
    router.push(`/room/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6">
      {/* Warm radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_600px_400px_at_50%_45%,rgba(160,120,50,0.07),transparent)]" />

      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-[340px]">
        {/* Title */}
        <h1
          className="animate-fade-in-up text-center font-serif text-5xl font-normal italic tracking-tight text-white"
          style={{ textShadow: "0 0 80px rgba(180, 130, 60, 0.25)" }}
        >
          Fleet
        </h1>

        {/* Tagline */}
        <p
          className="animate-fade-in-up mt-4 text-center text-[11px] font-light uppercase tracking-[0.25em] text-white/35"
          style={{ animationDelay: "100ms" }}
        >
          Ephemeral &middot; Private &middot; Gone in 30 minutes
        </p>

        {/* Divider */}
        <div
          className="animate-fade-in-up mx-auto mt-10 mb-10 h-px w-8 bg-white/10"
          style={{ animationDelay: "200ms" }}
        />

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-7"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem
                  className="animate-fade-in-up"
                  style={{ animationDelay: "250ms" }}
                >
                  <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                    Username
                  </label>
                  <FormControl>
                    <input
                      placeholder="alice"
                      autoComplete="off"
                      className="mt-1 w-full border-b border-white/10 bg-transparent pb-3 text-[15px] text-white/90 placeholder:text-white/15 transition-colors duration-300 focus:border-white/30 focus:outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400/80" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomName"
              render={({ field }) => (
                <FormItem
                  className="animate-fade-in-up"
                  style={{ animationDelay: "350ms" }}
                >
                  <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                    Room
                  </label>
                  <FormControl>
                    <input
                      placeholder="design-review"
                      autoComplete="off"
                      className="mt-1 w-full border-b border-white/10 bg-transparent pb-3 text-[15px] text-white/90 placeholder:text-white/15 transition-colors duration-300 focus:border-white/30 focus:outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400/80" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              className="animate-fade-in-up group mt-3 flex w-full cursor-pointer items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.03] py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90"
              style={{ animationDelay: "450ms" }}
            >
              Enter Room
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
