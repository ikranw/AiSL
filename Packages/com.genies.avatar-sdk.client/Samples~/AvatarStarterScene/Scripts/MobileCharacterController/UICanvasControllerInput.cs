
using UnityEngine;

namespace Genies.Sdk.Samples.AvatarStarter
{
    public class UICanvasControllerInput : MonoBehaviour
    {
        [field: SerializeField] public GeniesInputs GeniesInputs { get; set; }

        private void OnEnable()
        {
            if (GeniesInputs == null)
            {
                GeniesInputs = FindObjectOfType<GeniesInputs>();
            }

            if (GeniesInputs == null)
            {
                gameObject.SetActive(false);
            }
        }

        public void VirtualMoveInput(Vector2 virtualMoveDirection)
        {
            if (GeniesInputs != null)
            {
                GeniesInputs.MoveInput(virtualMoveDirection);
            }
        }

        public void VirtualLookInput(Vector2 virtualLookDirection)
        {
            if (GeniesInputs != null)
            {
                GeniesInputs.LookInput(virtualLookDirection);
            }
        }

        public void VirtualJumpInput(bool virtualJumpState)
        {
            if (GeniesInputs != null)
            {
                GeniesInputs.JumpInput(virtualJumpState);
            }
        }

        public void VirtualSprintInput(bool virtualSprintState)
        {
            if (GeniesInputs != null)
            {
                GeniesInputs.SprintInput(virtualSprintState);
            }
        }
    }
}
