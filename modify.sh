#!/bin/bash


# Copyright 2019 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
make_block_device_rw() {
  local block_dev="$1"
  [[ -b "${block_dev}" ]] || return 0
  if [[ $(sudo blockdev --getro "${block_dev}") == "1" ]]; then
    sudo blockdev --setrw "${block_dev}"
  fi
}

# Copyright 2019 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
is_ext2_rw_mount_enabled() {
  local rootfs=$1
  local offset="${2-0}"
  local ro_compat_offset=$((0x464 + 3))  # Get 'highest' byte
  local ro_compat_flag=$(sudo dd if="${rootfs}" \
    skip=$((offset + ro_compat_offset)) bs=1 count=1  status=none \
    2>/dev/null | hexdump -e '1 "%.2x"')
  test "${ro_compat_flag}" = "00"
}

# Copyright 2019 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
is_ext_filesystem() {
  local rootfs=$1
  local offset="${2-0}"
  local ext_magic_offset=$((0x400 + 56))
  local ext_magic=$(sudo dd if="${rootfs}" \
    skip=$((offset + ext_magic_offset)) bs=1 count=2 2>/dev/null |
    hexdump -e '1/2 "%.4x"')
  test "${ext_magic}" = "ef53"
}
enable_rw_mount() {
  local rootfs=$1
  local offset="${2-0}"
  local ro_compat_offset=$((0x464 + 3))  # Set 'highest' byte
  is_ext_filesystem "${rootfs}" "${offset}" || return 0
  is_ext2_rw_mount_enabled "${rootfs}" "${offset}" && return 0

  make_block_device_rw "${rootfs}"
  printf '\000' |
    sudo dd of="${rootfs}" seek=$((offset + ro_compat_offset)) \
      conv=notrunc count=1 bs=1 status=none
  # Force all of the file writes to complete, in case it's necessary for
  # crbug.com/954188
  sync
}

usage() {
    echo "Usage: <Shim file>"
}
if [ "$(id -u)" -ne 0 ]
then
    echo "Run as root"
    exit 0
fi
if [ $# -lt 1 ]
then
    usage
    exit 0
fi

# Find loop device
MOUNT_DIR=$(mktemp -d)
LOOP_DEV=$(losetup -f)
echo "Script Developer: jeffplays1292@gmail.com"

echo "This tool will modify your shim. There is a chance this tool will render it useless. This tool is in BETA. DO NOT SHARE THIS TOOL! "
echo "It is recommended to make a backup of your shim before continuing (Press ctrl-c in 5 seconds to stop this tool and make a backup)"
sleep 5

losetup -fP "$1"
echo "Using loop dev at $LOOP_DEV"
echo "Mounting at $MOUNT_DIR"
enable_rw_mount "$LOOP_DEV"p1
mount -o rw "$LOOP_DEV"p1 "$MOUNT_DIR"
mkdir -p "$MOUNT_DIR/usr/share/packeddata"
cp -rvf "./out/." "$MOUNT_DIR/usr/share/packeddata"
mkdir -p "$MOUNT_DIR"/usr/bin
umount "$MOUNT_DIR"
enable_rw_mount "$LOOP_DEV"p3
mount "$LOOP_DEV"p3 "$MOUNT_DIR"
cp "inshim.sh" "$MOUNT_DIR/usr/sbin/factory_install.sh"
chmod +x "$MOUNT_DIR/usr/sbin/factory_install.sh"

umount "$MOUNT_DIR"
sync
sync
sync
echo "success!"
