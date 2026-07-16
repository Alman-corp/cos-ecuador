export function Audit(options: { action: string; entity: string }): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      return original.apply(this, args);
    };
    Reflect.defineMetadata("audit:config", options, target, propertyKey);
    return descriptor;
  };
}
