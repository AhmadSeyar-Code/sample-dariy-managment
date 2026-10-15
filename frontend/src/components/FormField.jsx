export default function FormField({ label, name, value, onChange, type = 'text', placeholder, required = false, min, step }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-2 block text-[13px] font-semibold text-slate-700">
        {label}
        {required ? <span className="mr-1 text-red-500">*</span> : null}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        className="field-control"
      />
    </label>
  );
}
