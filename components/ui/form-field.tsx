// Sprint 4 / S4-3 — Erişilebilir form alanı sarmalayıcısı.
//
// Tarama raporu Sprint 4 / Kritik K-18: codebase'de `aria-describedby` ve
// `aria-required` 0 occurrence (form'larda hata/yardım metni input'a
// bağlı değil). Screen reader kullanıcıları input'a focus aldığında
// hata/açıklama duyumlarını alamıyordu.
//
// Bu component:
// - `<Label>` ↔ input ilişkisini `htmlFor` + `id` ile kurar
// - Açıklama (`aciklama`) ve hata (`hata`) için ayrı id'ler üretir
// - Input'a `aria-describedby` ekler (hata varsa hata id'si, yoksa
//   açıklama id'si)
// - `aria-required` `zorunlu` prop'una göre
// - `aria-invalid` `hata` varsa true
// - Hata için `role="alert"` + Türkçe semantic
//
// Kullanım:
//   <FormField label="E-posta" zorunlu hata={errors.email?.message}>
//     {(props) => <Input type="email" {...props} {...register("email")} />}
//   </FormField>

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export type FormFieldChildProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
};

type Props = {
  label: string;
  zorunlu?: boolean;
  aciklama?: React.ReactNode;
  hata?: string;
  children: (props: FormFieldChildProps) => React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  zorunlu,
  aciklama,
  hata,
  children,
  className,
}: Props) {
  const reactId = React.useId();
  const inputId = `${reactId}-input`;
  const aciklamaId = aciklama ? `${reactId}-aciklama` : undefined;
  const hataId = hata ? `${reactId}-hata` : undefined;

  // aria-describedby: hata varsa hata id'si önce, sonra açıklama id'si.
  // (NVDA/JAWS sırayla okur, hata önemlidir.)
  const describedBy =
    [hataId, aciklamaId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={inputId}>
        {label}
        {zorunlu && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children({
        id: inputId,
        "aria-describedby": describedBy,
        "aria-required": zorunlu || undefined,
        "aria-invalid": hata ? true : undefined,
      })}
      {aciklama && !hata && (
        <p
          id={aciklamaId}
          className="text-muted-foreground text-xs"
        >
          {aciklama}
        </p>
      )}
      {hata && (
        <p
          id={hataId}
          role="alert"
          className="text-destructive text-xs"
        >
          {hata}
        </p>
      )}
    </div>
  );
}
