#!/bin/python3
import crs_pb2
import sys
if (len(sys.argv) < 2):
    print("Usage: <chrome root store protobuf file>")
    exit(-1)
rs = crs_pb2.RootStore()
with open(sys.argv[1], 'rb') as f:
    rs.ParseFromString(f.read())
    print(rs)
