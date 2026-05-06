{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ],
      "include_dirs": [
        "<(module_root_dir)/../../lib/native",
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
