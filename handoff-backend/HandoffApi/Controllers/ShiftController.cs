using HandoffApi.Data;
using HandoffApi.Dtos;
using HandoffApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandoffApi.Controllers;

[ApiController]
[Authorize]
[Route("api/shift")]
public class ShiftController : ControllerBase
{
    private static readonly TimeSpan DayStart = TimeSpan.FromHours(7);
    private static readonly TimeSpan NightStart = TimeSpan.FromHours(19);

    [HttpGet("current")]
    public ActionResult<ShiftDto> GetCurrent()
    {
        var now = DateTime.Now;
        var today = now.Date;
        var dayChangeover = today + DayStart;
        var nightChangeover = today + NightStart;

        string label;
        DateTime changeoverAt;

        if (now < dayChangeover)
        {
            label = "Night → Day";
            changeoverAt = dayChangeover;
        }
        else if (now < nightChangeover)
        {
            label = "Day → Night";
            changeoverAt = nightChangeover;
        }
        else
        {
            label = "Night → Day";
            changeoverAt = today.AddDays(1) + DayStart;
        }

        return Ok(new ShiftDto
        {
            Unit = SeedData.Unit,
            Label = label,
            ChangeoverAt = DtoMapper.ToIso(changeoverAt),
        });
    }
}
