#!/bin/zsh
# raw generated PNGs -> web-ready WebP in assets/img
cd "$(dirname "$0")/.."
PY=${PY:-python3}
R=assets/raw; O=assets/img
mkdir -p $O
cut() { [[ -f $R/$1.png ]] && "$PY" tools/cutout.py $R/$1.png "${@:2}"; }

cut petals_sheet          $O/petals/petal --split --max 220
cut corner_tl             $O/corner_tl.webp --max 1200
cut corner_br             $O/corner_br.webp --max 1200
cut garland_body          $O/garland.webp --max 2400
cut garland_strands       $O/strands/strand --split --max 700
cut vine_left             $O/vine_left.webp --max 1600
cut spray_right           $O/spray_right.webp --max 1400
cut blossoms_sheet        $O/blossoms/blossom --split --max 360
cut foreground_blossoms   $O/fg/fg --split --max 520
cut arch_border           $O/arch_border.webp --max 1600
cut frame_cluster         $O/frame_cluster.webp --max 900
cut closing_base          $O/closing_base.webp --max 1800

# non-cutout images
[[ -f $R/paper_tile.png ]] && "$PY" -c "from PIL import Image; Image.open('$R/paper_tile.png').convert('RGB').resize((1024,1024), Image.LANCZOS).save('$O/paper.webp', quality=82)"
[[ -f $R/hero_still.png ]] && "$PY" -c "from PIL import Image; im=Image.open('$R/hero_still.png').convert('RGB'); im.thumbnail((2400,2400)); im.save('$O/hero.webp', quality=80)"
[[ -f $R/hero_still_mobile.png ]] && "$PY" -c "from PIL import Image; im=Image.open('$R/hero_still_mobile.png').convert('RGB'); im.thumbnail((1400,1400)); im.save('$O/hero_m.webp', quality=80)"
true
