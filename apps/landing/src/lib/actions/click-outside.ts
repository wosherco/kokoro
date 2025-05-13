interface ClickOutsideConfig {
  enabled: boolean;
  cb: () => void;
}

export function clickOutside(node: HTMLElement, config: ClickOutsideConfig) {
  const handleClick = (event: MouseEvent) => {
    if (!config.enabled) return;

    if (!node.contains(event.target as Node) && !event.defaultPrevented) {
      config.cb();
    }
  };

  document.addEventListener("click", handleClick, true);

  return {
    update(newConfig: ClickOutsideConfig) {
      // biome-ignore lint/style/noParameterAssign: idk, this was AI written
      config = newConfig;
    },
    destroy() {
      document.removeEventListener("click", handleClick, true);
    },
  };
}
