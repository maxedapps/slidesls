import { RegistrySource, loadRegistry } from "../registry/source.mjs";
import { usageError } from "../shared/args.mjs";

export function rejectRemovedRegistryOption(args) {
  if (args.registry !== undefined)
    throw usageError(
      "--registry has been removed.",
      "Use --registry-root <path> or --registry-url <url>.",
    );
}

export function registrySource(args) {
  return new RegistrySource({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
}

export async function registryData(args) {
  const source = registrySource(args);
  return loadRegistry(source);
}
