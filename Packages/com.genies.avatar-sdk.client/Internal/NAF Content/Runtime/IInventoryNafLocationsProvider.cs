using System.Collections;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using Genies.Inventory;
using UnityEngine;

namespace Genies.Naf.Content
{
    public interface IInventoryNafLocationsProvider
    {
        public UniTask UpdateAssetLocations(DefaultInventoryAsset asset);
        public UniTask AddCustomResourceLocationsFromInventory(bool includeV1Inventory = false);
    }
}
