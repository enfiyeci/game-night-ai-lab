#!/bin/zsh
D="$(cd "$(dirname "$0")" && pwd)"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
F="file://$D/K2-gdt-polished.html"
shot(){ "$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --window-size=$1 --screenshot=$D/$2 "$F$3" 2>/dev/null; }
shot 1440,900 K2-gdt-polished-idle.png ""
shot 1440,900 K2-gdt-polished-menu.png "#menu"
shot 1440,900 K2-gdt-polished-dialog.png "#dialog"
shot 1440,900 K2-gdt-polished-release.png "#release"
shot 1000,700 K2-gdt-polished-fit.png ""
ls -la $D/K2-gdt-polished*.png
