{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.c" ],
      "include_dirs": [ "<(module_root_dir)/../../lib/native" ],
      "cflags": [ "-O2", "-Wall", "-Wextra" ]
    }
  ]
}
