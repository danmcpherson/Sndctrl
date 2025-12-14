# Macros File Configuration

## Problem
The application uses a `macros.txt` file that could be accessed from different locations, causing inconsistency:
- Source: `/api/data/macros.txt`
- Build output: `/api/bin/Debug/net8.0/data/macros.txt`

## Solution
The following changes ensure both the MacroService and SocoCliService always use the same `macros.txt` file:

### 1. Build Configuration (`api.csproj`)
The data directory is now automatically copied to the build output:

```xml
<ItemGroup>
  <Content Include="data\**\*">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    <CopyToPublishDirectory>PreserveNewest</CopyToPublishDirectory>
  </Content>
</ItemGroup>
```

### 2. Absolute Path Resolution
Both services convert relative paths to absolute paths:
- **MacroService**: Uses `Path.GetFullPath(Path.Combine(dataDir, "macros.txt"))`
- **SocoCliService**: Uses `Path.GetFullPath(macrosFile)`

### 3. Configuration (`appsettings.json`)
Both settings must use the same base path:
```json
{
  "DataDirectory": "data",
  "SocoCli": {
    "MacrosFile": "data/macros.txt"
  }
}
```

### 4. Git Configuration
The `data/` directory is excluded from git (except `.gitkeep`), and files are created automatically at runtime.

## Verification
To verify both services use the same file, check the logs at startup:
- MacroService logs: `"Created default macros file at {Path}"`
- SocoCliService logs: `"Using macros file: {MacrosPath}"`

Both should show the same absolute path.

## Best Practices
1. Always use the same base directory in both `DataDirectory` and `SocoCli:MacrosFile`
2. The application will create the file automatically if it doesn't exist
3. When deployed, the data directory will be at the same relative location
4. On Raspberry Pi, consider symlinking to a persistent location if needed
