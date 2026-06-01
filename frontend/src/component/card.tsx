import { Coffee } from "lucide-react";

export function Card(props: {
  src: string;
  header?: string;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div>
      <div className="p-6 bg-paper border-2 border-black text-black sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center w-full gap-3">
          {props.src ? (
            <img className="w-10 h-10" src={props.src} alt="logo" />
          ) : (
            <Coffee width={40} height={40} />
          )}
          
          <div className="flex flex-col flex-1">
            {props.header ? (
              <p>{props.header}</p>
            ) : (
              <p>header</p>
            )}
            {props.placeholder ? (
              <p>{props.placeholder}</p>
            ) : (
              <p className="text-gray-300">placeholder</p>
            )}
          </div>
           
          <div className="text-right whitespace-nowrap">
            {props.label ? <p>{props.label}</p> : <p className="hidden">label</p>}
          </div>
        </div>
      </div>
    </div>
  );
}