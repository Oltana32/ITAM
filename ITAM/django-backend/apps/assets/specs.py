# django-backend/apps/assets/specs.py
"""
Dynamic specification fields and options for different asset categories.
"""

# CPU options for Laptop, Desktop, Server
CPU_OPTIONS = [
    "Intel Core i3",
    "Intel Core i5",
    "Intel Core i7",
    "Intel Core i9",
    "Intel Xeon",
    "AMD Ryzen 3",
    "AMD Ryzen 5",
    "AMD Ryzen 7",
    "AMD Ryzen 9",
    "AMD EPYC",
]

# RAM options (in GB)
RAM_OPTIONS = [
    "4GB",
    "8GB",
    "16GB",
    "32GB",
    "64GB",
    "128GB",
]

# Storage options
STORAGE_OPTIONS = [
    "128GB SSD",
    "256GB SSD",
    "512GB SSD",
    "1TB SSD",
    "2TB SSD",
    "500GB HDD",
    "1TB HDD",
    "2TB HDD",
    "4TB HDD",
]

# Operating System options
OS_OPTIONS = [
    "Windows 10 Pro",
    "Windows 11 Pro",
    "Windows Server 2019",
    "Windows Server 2022",
    "Ubuntu Linux",
    "Red Hat Enterprise Linux",
]

# Printer Type options
PRINTER_TYPE_OPTIONS = [
    "Laser",
    "Inkjet",
    "Thermal",
    "Dot Matrix",
    "ID Card Printer",
    "Multifunction Printer",
]

# Connectivity options
CONNECTIVITY_OPTIONS = [
    "USB",
    "Ethernet",
    "Wi-Fi",
    "Bluetooth",
    "USB + Ethernet",
    "Wi-Fi + Ethernet",
]

# Monitor Screen Size options
SCREEN_SIZE_OPTIONS = [
    "19\"",
    "22\"",
    "24\"",
    "27\"",
    "32\"",
]

# Monitor Resolution options
RESOLUTION_OPTIONS = [
    "HD",
    "Full HD",
    "QHD",
    "4K",
]

# Network Device Port Count options
PORT_COUNT_OPTIONS = [
    "4",
    "8",
    "16",
    "24",
    "32",
    "48",
    "64",
]

# Category-specific required fields
CATEGORY_SPECS = {
    "laptop": {
        "label": "Laptop Specifications",
        "fields": {
            "cpu": {
                "label": "CPU",
                "type": "select",
                "options": CPU_OPTIONS,
                "required": False,
            },
            "ram": {
                "label": "RAM",
                "type": "select",
                "options": RAM_OPTIONS,
                "required": False,
            },
            "storage": {
                "label": "Storage",
                "type": "select",
                "options": STORAGE_OPTIONS,
                "required": False,
            },
            "os": {
                "label": "Operating System",
                "type": "select",
                "options": OS_OPTIONS,
                "required": False,
            },
        },
    },
    "desktop": {
        "label": "Desktop Specifications",
        "fields": {
            "cpu": {
                "label": "CPU",
                "type": "select",
                "options": CPU_OPTIONS,
                "required": False,
            },
            "ram": {
                "label": "RAM",
                "type": "select",
                "options": RAM_OPTIONS,
                "required": False,
            },
            "storage": {
                "label": "Storage",
                "type": "select",
                "options": STORAGE_OPTIONS,
                "required": False,
            },
            "os": {
                "label": "Operating System",
                "type": "select",
                "options": OS_OPTIONS,
                "required": False,
            },
        },
    },
    "server": {
        "label": "Server Specifications",
        "fields": {
            "cpu": {
                "label": "CPU",
                "type": "select",
                "options": CPU_OPTIONS,
                "required": False,
            },
            "ram": {
                "label": "RAM",
                "type": "select",
                "options": RAM_OPTIONS,
                "required": False,
            },
            "storage": {
                "label": "Storage",
                "type": "select",
                "options": STORAGE_OPTIONS,
                "required": False,
            },
            "os": {
                "label": "Operating System",
                "type": "select",
                "options": OS_OPTIONS,
                "required": False,
            },
        },
    },
    "printer": {
        "label": "Printer Specifications",
        "fields": {
            "printer_type": {
                "label": "Printer Type",
                "type": "select",
                "options": PRINTER_TYPE_OPTIONS,
                "required": False,
            },
            "connectivity": {
                "label": "Connectivity",
                "type": "select",
                "options": CONNECTIVITY_OPTIONS,
                "required": False,
            },
        },
    },
    "monitor": {
        "label": "Monitor Specifications",
        "fields": {
            "screen_size": {
                "label": "Screen Size",
                "type": "select",
                "options": SCREEN_SIZE_OPTIONS,
                "required": False,
            },
            "resolution": {
                "label": "Resolution",
                "type": "select",
                "options": RESOLUTION_OPTIONS,
                "required": False,
            },
        },
    },
    "network": {
        "label": "Network Device Specifications",
        "fields": {
            "port_count": {
                "label": "Port Count",
                "type": "text",
                "required": False,
            },
            "ip_address": {
                "label": "IP Address",
                "type": "text",
                "required": False,
            },
            "mac_address": {
                "label": "MAC Address",
                "type": "text",
                "required": False,
            },
        },
    },
}


def get_specs_for_category(category: str) -> dict:
    """Get the specification fields configuration for a given category."""
    return CATEGORY_SPECS.get(category, {})


def get_spec_options(category: str, field_name: str) -> list:
    """Get the available options for a specific field in a category."""
    specs = get_specs_for_category(category)
    field_config = specs.get("fields", {}).get(field_name, {})
    return field_config.get("options", [])
